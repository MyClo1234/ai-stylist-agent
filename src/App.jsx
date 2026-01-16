import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
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
    <div className="text-white min-h-screen selection:bg-primary selection:text-black bg-[#0f0f12]">
      <main className="max-w-5xl mx-auto min-h-screen relative overflow-x-hidden bg-[#09090b] shadow-2xl border-x border-white/5">
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
          <Route path="/wardrobe/new" element={<WardrobeNew />} />
          <Route path="/wardrobe/:id" element={<ItemDetail />} />
          <Route path="/outfits/:id" element={<OutfitDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
