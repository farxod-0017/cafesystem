import Home from "../../pages/Cafe/Home/Home";
import OrderCreate from "../../pages/Cafe/Order-Create/OrderCreate";
import Orders from "../../pages/Cafe/Orders/Orders";
import Return from "../../pages/Cafe/Return/Return";

const cafeRoutes = [
    {
        name: "cf home",
        path: "dashboard",
        element: <Home />
    },
    {
        name: "cf order create",
        path: "order-create",
        element: <OrderCreate />
    },
    {
        name: "cf orders",
        path: "orders",
        element: <Orders />
    },
    {
        name: "cf orders return",
        path: "return/:id",
        element: <Return />
    },
];
export default cafeRoutes