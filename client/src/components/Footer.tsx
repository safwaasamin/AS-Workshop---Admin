import { HeartIcon } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-5 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} AspiraSys Workshop System. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="flex items-center">
              Made with <HeartIcon className="text-red-500 w-4 h-4 mx-1" /> for workshop attendees
            </span>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">
              <i className="bi bi-question-circle"></i>
              <span className="ml-1">Help</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">
              <i className="bi bi-envelope"></i>
              <span className="ml-1">Contact</span>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary-600 transition-colors">
              <i className="bi bi-shield-check"></i>
              <span className="ml-1">Privacy</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}