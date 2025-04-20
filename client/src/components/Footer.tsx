const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">&copy; 2023 EduConnect. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-600 hover:text-primary text-sm">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-primary text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-primary text-sm">Help & Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
