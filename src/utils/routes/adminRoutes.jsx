import UserAccountPage from "../../pages/Admin/Account/Acccount";
import CategoriesPage from "../../pages/Admin/Categories/Categories";
import AdminHome from "../../pages/Admin/Home/Home";
import MenuProducts from "../../pages/Admin/MenuProducts/MenuProducts";
import PayMethodsPage from "../../pages/Admin/PayMethods/PayMethods";

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
  },
  {
    name:"ad user acc page",
    path:'account',
    element:<UserAccountPage/>
  },
  {
    name:"admin menu products",
    path:'menu-mahsulotlar',
    element:<MenuProducts/>
  }
];

export default adminRoutes