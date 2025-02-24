"use client";
import { Box } from "@mui/material";
// ©J9 Legacy Foundation., J9information@gmail.com 
const Footer: React.FC = () => {
    return (
    <footer className="bg-blue-900 text-white py-6">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <a href="mailto:J9information@gmail.com" className="text-blue-200 hover:text-blue-100 transition duration-300">
            J9information@gmail.com
          </a>
        </div>
        <div className="w-px h-6 bg-blue-300 mx-4 hidden md:block"></div>
        <div className="text-blue-200">&copy; {new Date().getFullYear()} J9 Foundation. All rights reserved.</div>
      </div>
    </footer>
    );
  };
  
export default Footer;