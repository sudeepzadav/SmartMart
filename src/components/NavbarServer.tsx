
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";

export default async function NavbarServer() {
  const session = await getSession();

  return <Navbar isAuthenticated={Boolean(session)} />;
}
