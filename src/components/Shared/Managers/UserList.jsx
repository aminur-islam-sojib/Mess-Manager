import { Mail, ShieldCheck, User, MoreVertical, Circle } from "lucide-react";

const UserList = ({ data, messName }) => {
  const users = data || [];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {messName}
          </h2>
          <p className="text-muted-foreground">
            Manage your team members and roles.
          </p>
        </div>
        <div className="text-sm font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
          {users.length} Members
        </div>
      </div>

      {/* Table/List Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50">
            <tr className="text-sm font-medium text-muted-foreground">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.userId}
                className="hover:bg-muted/30 transition-colors group"
              >
                {/* Name & Email */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail size={12} /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Role Badge */}
                <td className="px-6 py-4">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                      user.role === "manager"
                        ? "bg-amber-500/10 text-amber-600 border-amber-200"
                        : "bg-blue-500/10 text-blue-600 border-blue-200"
                    }`}
                  >
                    {user.role === "manager" ? (
                      <ShieldCheck size={14} />
                    ) : (
                      <User size={14} />
                    )}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Circle
                      size={8}
                      className="fill-green-500 text-green-500"
                    />
                    {user.status}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
