export function RoleSelect() {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
      <select
        required
        name="role"
        defaultValue="student"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink outline-none transition focus:border-sky focus:bg-white"
      >
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
    </label>
  );
}
