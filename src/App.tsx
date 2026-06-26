import { Route, Routes } from "react-router-dom"
import Home from "./views/Home"
import Welcome from "./views/Welcome"
import OurStory from "./views/OurStory"
import Brands from "./views/Brands"
import RoutePaths from "./config"

function App() {

  return (
    <Routes>

      <Route path={RoutePaths.welcome} element={<Welcome />}></Route>
      <Route path={RoutePaths.home} element={<Home />}></Route>
      <Route path={RoutePaths.ourstory} element={<OurStory />}></Route>
      <Route path={RoutePaths.brands} element={<Brands />}></Route>
      <Route path="*" element={<Welcome />}></Route>

    </Routes>
    
  )
}

export default App

