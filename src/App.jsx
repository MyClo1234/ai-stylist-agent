import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import Outfits from './pages/Outfits';
import CalendarPage from './pages/CalendarPage';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import WardrobeNew from './pages/WardrobeNew';
import ItemDetail from './pages/ItemDetail';
import OutfitDetail from './pages/OutfitDetail';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavbar = ['/login', '/onboarding', '/wardrobe/new'].includes(location.pathname);

  return (
    <div className="text-white min-h-screen font-sans selection:bg-primary selection:text-black">
      <main>
        {children}
      </main>
      {!hideNavbar && <Navbar />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/wardrobe/new" element={<WardrobeNew />} />
          <Route path="/wardrobe/:id" element={<ItemDetail />} />
          <Route path="/outfits" element={<Outfits />} />
          <Route path="/outfits/:id" element={<OutfitDetail />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
