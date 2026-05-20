import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col max-w-[100vw] bg-[hsl(0_0%_98%)]">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
