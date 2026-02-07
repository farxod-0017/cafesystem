import UserAccountPage from "../../pages/Admin/Account/Acccount";
import CashsPage from "../../pages/Admin/Cashs/Cashs";
import CategoriesPage from "../../pages/Admin/Categories/Categories";
import AdminHome from "../../pages/Admin/Home/Home";
import MenuProducts from "../../pages/Admin/MenuProducts/MenuProducts";
import PayMethodsPage from "../../pages/Admin/PayMethods/PayMethods";
import ProductMaterialsPage from "../../pages/Admin/ProductMaterialPair/ProductMaterialPair";
import Products from "../../pages/Admin/Products/Products";

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
    path:'menu',
    element:<MenuProducts/>
  },
  {
    name:"admin products",
    path:'mahsulotlar',
    element:<Products/>
  },
  {
    name:"admin menu product details",
    path:'menu/:cafeId/products/:menuProductId',
    element:<ProductMaterialsPage/>
  },
  {
    name:"admin cashs", 
    path:'kassalar',
    element:<CashsPage/>
  }
];

export default adminRoutes