import CategoriesPage from "../../pages/Admin/Categories/Categories";
import AdminHome from "../../pages/Admin/Home/Home";
import PayMethodsPage from "../../pages/Cafe/PayMethods/PayMethods";

const adminRoutes = [
  {
    name:"admin home",
    path:"",
    element:<AdminHome/>
  },
  {
    name:"admin pay methods",
    path:"tolov-usullari",
    element:<PayMethodsPage/>
  },
  {
    name:"admin categories",
    path:'kategoriyalar',
    element:<CategoriesPage/>
  }
];

export default adminRoutes