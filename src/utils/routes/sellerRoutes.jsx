
import OrderCreate from "../../pages/Cafe/Order-Create/OrderCreate";
import Orders from "../../pages/Cafe/Orders/Orders";
import Return from "../../pages/Cafe/Return/Return";

const sellerRoutes = [
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
        path: "tahrir/:id",
        element: <Return />
    },
   
    
];
export default sellerRoutes