import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/lib/components/layout/footer";
import Header from "@/lib/components/layout/header";

export const metadata: Metadata = {
  title: "J9 Legacy Foundation",
/*  description: "",
   icons: {
      icons: {
          url: "",
          type: "image/png"
      }
   } */
};

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <Header/>
        <main>
          {children}
        </main>
        <Footer/>
      </body>
    </html>
  );
};

export default RootLayout;