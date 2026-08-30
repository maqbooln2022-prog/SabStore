export const rupee = (n) =>
  `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// user.user_metadata.full_name, falling back to the email's local part
// if the owner hasn't set a name (or hasn't signed up since name
// collection was added).
export function displayName(user) {
  if (!user) return "";
  const fullName = user.user_metadata?.full_name;
  if (fullName) return fullName.split(" ")[0];
  return user.email?.split("@")[0] || "";
}
