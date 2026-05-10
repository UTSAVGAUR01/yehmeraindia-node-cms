import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Trending from './pages/Trending'
import About from './pages/About'
import Anchor from './pages/Anchor'
import Author from './pages/Author'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/about" element={<About />} />
        <Route path="/anchor" element={<Anchor />} />
        <Route path="/author" element={<Author />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
