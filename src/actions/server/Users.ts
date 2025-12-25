"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { InputUser, User } from "@/types/Model";
import bcrypt from "bcryptjs";

/* ----------------------------------------
   GET USERS
---------------------------------------- */
export const getUsers = async () => {
  try {
    // here code changes
    const collection = await dbConnect(collections.USERS);
    const users = await collection.find().toArray();
    return users;
  } catch (error) {
    console.error("❌ Error fetching users:", error);

    // here code changes
    throw new Error("Failed to fetch users");
  }
};

/* ----------------------------------------
   CREATE USER
---------------------------------------- */
export const createUser = async (payload: InputUser) => {
  const { fullName, email, confirmPassword, role } = payload;

  const hashedPassword = await bcrypt.hash(confirmPassword, 10);

  const user: User = {
    name: fullName,
    email,
    password: hashedPassword,
    role,
  };

  try {
    const collection = await dbConnect(collections.USERS);

    const isExist = await collection.findOne({ email });
    if (isExist) {
      return { success: false, message: "User Already Exist!" };
    }

    const result = await collection.insertOne(user);

    return {
      success: true,
      userId: result.insertedId.toString(),
      message: "User Created Successfully!",
    };
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return {
      success: false,
      message: "Failed to create user",
    };
  }
};
