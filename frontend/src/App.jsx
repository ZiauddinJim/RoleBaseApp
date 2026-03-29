import { BrowserRouter, Routes, Route } from "react-router";

import Posts from "../pages/Posts";
import Login from "../pages/Login";
import Register from "../pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Posts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;