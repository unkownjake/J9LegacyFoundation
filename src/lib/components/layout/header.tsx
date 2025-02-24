"use client";
import { AppBar, Toolbar, Container, List, ListItem, ListItemButton, ListItemText, Box } from "@mui/material";
import { Link } from 'react-router-dom';

const navItems = ['Home', 'Donations', 'Events', 'About'];

const Header: React.FC = () => {
    return (
        <header className="bg-gray-100 shadow-md">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-4 md:mb-0"> Foundation</h2>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="text-gray-600 hover:text-blue-600 transition duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/donate" className="text-gray-600 hover:text-blue-600 transition duration-300">
                  Donate
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-600 hover:text-blue-600 transition duration-300">
                  About
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-600 hover:text-blue-600 transition duration-300">
                  Events
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    )
  };
  
export default Header;