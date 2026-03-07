"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { CreateMessPayload } from "@/types/MessTypes";
import type {
  GetMessMembersResponse,
  MessMember,
  MessMemberRole,
} from "@/types/MessMember";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const createMess = async (payload: CreateMessPayload) => {
  const { managerId, messName, managerEmail } = payload;

  const messCollection = dbConnect(collections.MESS);
  const userCollection = dbConnect(collections.USERS);
  const memberCollection = dbConnect(collections.MESS_MEMBERS);

  const managerObjectId = new ObjectId(managerId);

  // 1️⃣ Check user exists
  const user = await userCollection.findOne({ _id: managerObjectId });
  if (!user) {
    return { success: false, message: "User not found" };
  }

  // 2️⃣ Prevent duplicate mess
  const existingMess = await messCollection.findOne({
    managerId: managerObjectId,
  });

  if (existingMess) {
    return { success: false, message: "Mess already exists" };
  }

  // 3️⃣ Create mess
  const messResult = await messCollection.insertOne({
    messName,
    managerId: managerObjectId,
    managerEmail,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const messId = messResult.insertedId;

  // 4️⃣ Insert MANAGER into mess_members 🔥
  await memberCollection.insertOne({
    messId,
    userId: managerObjectId,
    role: "manager",
    status: "active",
    joinDate: new Date(),
    createdAt: new Date(),
  });

  // 5️⃣ Update user role
  await userCollection.updateOne(
    { _id: managerObjectId },
    {
      $set: {
        role: "manager",
        updatedAt: new Date(),
      },
    },
  );

  // 6️⃣ Revalidate cache
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/manager");
  revalidatePath("/dashboard/user");

  return {
    success: true,
    message: "Mess created & manager added",
    messId: messId.toString(),
  };
};

export const getSingleMessForUser = async (userId: string) => {
  if (!userId) {
    return {
      success: false,
      message: "User id required",
    };
  }

  try {
    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);

    const userObjectId = new ObjectId(userId);

    // 1️⃣ Check if user is MANAGER
    const managedMess = await messCollection.findOne({
      managerId: userObjectId,
      status: "active",
    });

    if (managedMess) {
      return {
        success: true,
        role: "manager",
        mess: {
          _id: managedMess._id.toString(),
          messName: managedMess.messName,
          managerId: managedMess.managerId.toString(),
          status: managedMess.status,
          createdAt: managedMess.createdAt?.toISOString(),
          updatedAt: managedMess.updatedAt?.toISOString(),
        },
      };
    }

    // 2️⃣ Check if user is MEMBER
    const membership = await memberCollection.findOne({
      userId: userObjectId,
      status: "active",
    });

    if (!membership) {
      return {
        success: false,
        message: "No mess found for this user",
      };
    }

    // 3️⃣ Fetch mess info
    const mess = await messCollection.findOne({
      _id: new ObjectId(membership.messId),
      status: "active",
    });

    if (!mess) {
      return {
        success: false,
        message: "Mess not found",
      };
    }

    // 👉 Member view (LIMITED DATA)
    return {
      success: true,
      role: membership.role || "member",
      mess: {
        _id: mess._id.toString(),
        messName: mess.messName,
        managerId: mess.managerId.toString(),
      },
    };
  } catch (error) {
    console.error("❌ Error fetching mess:", error);
    return {
      success: false,
      message: "Failed to fetch mess",
    };
  }
};

// Backwards-compatible alias for code that imports `getSingleMess`
export const getSingleMess = getSingleMessForUser;

export const getMessMembers = async (): Promise<GetMessMembersResponse> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);

    const membership = await memberCollection.findOne({
      userId,
      status: "active",
    });

    if (!membership) {
      return {
        success: false,
        message: "User is not part of any active mess",
      };
    }

    const mess = await messCollection.findOne({
      _id: membership.messId,
      status: "active",
    });

    if (!mess) {
      return {
        success: false,
        message: "Mess not found or inactive",
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthStartKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const monthEndKey = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const [
      messMembers,
      monthlyExpenseAgg,
      monthlyMealAgg,
      memberMealsAgg,
      memberDepositsAgg,
    ] = await Promise.all([
      memberCollection
        .aggregate<{
          userId: ObjectId;
          role: string;
          status: string;
          joinDate?: Date;
          userName?: string;
          userEmail?: string;
        }>([
          {
            $match: {
              messId: mess._id,
              status: "active",
            },
          },
          {
            $lookup: {
              from: collections.USERS,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: 1,
              role: 1,
              status: 1,
              joinDate: 1,
              userName: "$user.name",
              userEmail: "$user.email",
            },
          },
          { $sort: { userName: 1 } },
        ])
        .toArray(),
      dbConnect(collections.EXPENSES)
        .aggregate<{ totalMessExpense: number }>([
          {
            $match: {
              messId: mess._id,
              status: "approved",
              expenseDate: { $gte: monthStartKey, $lt: monthEndKey },
            },
          },
          { $group: { _id: null, totalMessExpense: { $sum: "$amount" } } },
          { $project: { _id: 0, totalMessExpense: 1 } },
        ])
        .toArray(),
      dbConnect(collections.MEAL_ENTRIES)
        .aggregate<{ totalMessMeals: number }>([
          {
            $match: {
              messId: mess._id,
              date: { $gte: monthStartKey, $lt: monthEndKey },
            },
          },
          { $group: { _id: null, totalMessMeals: { $sum: "$meals" } } },
          { $project: { _id: 0, totalMessMeals: 1 } },
        ])
        .toArray(),
      dbConnect(collections.MEAL_ENTRIES)
        .aggregate<{ _id: ObjectId; monthlyMeals: number }>([
          {
            $match: {
              messId: mess._id,
              date: { $gte: monthStartKey, $lt: monthEndKey },
            },
          },
          { $group: { _id: "$userId", monthlyMeals: { $sum: "$meals" } } },
          { $project: { _id: 1, monthlyMeals: 1 } },
        ])
        .toArray(),
      dbConnect(collections.DEPOSITS)
        .aggregate<{ _id: ObjectId; totalDeposit: number }>([
          { $match: { messId: mess._id } },
          { $group: { _id: "$userId", totalDeposit: { $sum: "$amount" } } },
          { $project: { _id: 1, totalDeposit: 1 } },
        ])
        .toArray(),
    ]);

    if (messMembers.length === 0) {
      return {
        success: true,
        messId: mess._id.toString(),
        messName: mess.messName,
        currentMonth: {
          month: currentMonth,
          year: currentYear,
          totalMessExpense: 0,
          totalMessMealCount: 0,
          costPerMeal: 0,
        },
        members: [],
      };
    }

    const totalMessExpense = monthlyExpenseAgg[0]?.totalMessExpense ?? 0;
    const totalMessMeals = monthlyMealAgg[0]?.totalMessMeals ?? 0;
    const costPerMeal =
      totalMessMeals > 0 ? totalMessExpense / totalMessMeals : 0;

    const memberMealMap = new Map(
      memberMealsAgg.map((item) => [item._id.toString(), item.monthlyMeals]),
    );
    const memberDepositMap = new Map(
      memberDepositsAgg.map((item) => [item._id.toString(), item.totalDeposit]),
    );

    const round2 = (value: number) => Number(value.toFixed(2));
    const toMemberRole = (value: string): MessMemberRole =>
      value === "manager" ? "manager" : "member";

    const members: MessMember[] = messMembers.map((member) => {
      const memberId = member.userId.toString();
      const monthlyMeals = memberMealMap.get(memberId) ?? 0;
      const monthlyMealCost = round2(monthlyMeals * costPerMeal);
      const totalDeposit = round2(memberDepositMap.get(memberId) ?? 0);
      const currentBalance = round2(totalDeposit - monthlyMealCost);

      return {
        userId: memberId,
        name: member.userName || "Unknown",
        email: member.userEmail || "Unknown",
        role: toMemberRole(member.role),
        status: member.status,
        joinDate: member.joinDate?.toISOString() ?? new Date(0).toISOString(),
        monthlyMeals,
        monthlyMealCost,
        totalDeposit,
        currentBalance,
      };
    });

    return {
      success: true,
      messId: mess._id.toString(),
      messName: mess.messName,
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        totalMessExpense: round2(totalMessExpense),
        totalMessMealCount: totalMessMeals,
        costPerMeal: round2(costPerMeal),
      },
      members,
    };
  } catch (error) {
    console.error("❌ Error fetching mess users:", error);
    return {
      success: false,
      message: "Failed to fetch mess users",
    };
  }
};

export const getMessMembersWithBalance = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const depositCollection = dbConnect(collections.DEPOSITS);
    const expenseCollection = dbConnect(collections.EXPENSES);

    // 1️⃣ Find user's active mess
    const membership = await memberCollection.findOne({
      userId,
      status: "active",
    });

    if (!membership) {
      return { success: false, message: "User is not part of any active mess" };
    }

    const mess = await messCollection.findOne({
      _id: membership.messId,
      status: "active",
    });

    if (!mess) {
      return { success: false, message: "Mess not found or inactive" };
    }

    // 2️⃣ Get all active members
    const messMembers = await memberCollection
      .aggregate([
        { $match: { messId: mess._id, status: "active" } },
        {
          $lookup: {
            from: collections.USERS,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            userId: 1,
            role: 1,
            status: 1,
            joinDate: 1,
            userName: "$user.name",
            userEmail: "$user.email",
          },
        },
        { $sort: { userName: 1 } },
      ])
      .toArray();

    if (messMembers.length === 0) {
      return { success: true, members: [] };
    }

    // 3️⃣ Calculate total meals per member
    const memberMealsAgg = await mealCollection
      .aggregate([
        { $match: { messId: mess._id } },
        { $group: { _id: "$userId", totalMeals: { $sum: "$meals" } } },
      ])
      .toArray();

    // 4️⃣ Calculate total deposits per member
    const memberDepositsAgg = await depositCollection
      .aggregate([
        { $match: { messId: mess._id } },
        { $group: { _id: "$userId", totalDeposit: { $sum: "$amount" } } },
      ])
      .toArray();

    // 5️⃣ Calculate cost per meal for the mess (all-time)
    const totalMessExpensesAgg = await expenseCollection
      .aggregate([
        { $match: { messId: mess._id, status: "approved" } },
        { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
      ])
      .toArray();

    const totalMessMealsAgg = await mealCollection
      .aggregate([
        { $match: { messId: mess._id } },
        { $group: { _id: null, totalMeals: { $sum: "$meals" } } },
      ])
      .toArray();

    const totalMessExpense = totalMessExpensesAgg[0]?.totalExpense ?? 0;
    const totalMessMeals = totalMessMealsAgg[0]?.totalMeals ?? 0;
    const costPerMeal =
      totalMessMeals > 0 ? totalMessExpense / totalMessMeals : 0;

    const memberMealMap = new Map(
      memberMealsAgg.map((m) => [m._id.toString(), m.totalMeals]),
    );
    const memberDepositMap = new Map(
      memberDepositsAgg.map((d) => [d._id.toString(), d.totalDeposit]),
    );

    const round2 = (value: number) => Number(value.toFixed(2));

    const members = messMembers.map((member) => {
      const memberId = member.userId.toString();
      const totalMeals = memberMealMap.get(memberId) ?? 0;
      const totalMealCost = round2(totalMeals * costPerMeal);
      const totalDeposit = round2(memberDepositMap.get(memberId) ?? 0);
      const currentBalance = round2(totalDeposit - totalMealCost);

      return {
        userId: memberId,
        name: member.userName || "Unknown",
        email: member.userEmail || "Unknown",
        role: member.role,
        status: member.status,
        joinDate: member.joinDate?.toISOString(),
        totalMeals,
        totalMealCost,
        totalDeposit,
        currentBalance,
      };
    });

    return {
      success: true,
      messId: mess._id.toString(),
      messName: mess.messName,
      costPerMeal: round2(costPerMeal),
      members,
    };
  } catch (error) {
    console.error("❌ Error fetching mess members with balance:", error);
    return { success: false, message: "Failed to fetch mess members" };
  }
};
