import CafeChiqim from "../../pages/Cafe/CafeChiqim/CafeChiqim";
import CafeClientDetail from "../../pages/Cafe/CafeClientDetail/CafeClientDetail";
import CafedagiTovarlar from "../../pages/Cafe/CafedagiTovarlar/CafedagiTovarlar";
import CafePartnerDetail from "../../pages/Cafe/CafePartnerDetail/CafePartnerDetail";
import Home from "../../pages/Cafe/Home/Home";
import CafeKirim from "../../pages/Cafe/Kirim/CafeKirim";
import CafeClients from "../../pages/Cafe/Klientlar/CafeClients";
import OperatsiyalarTarixi from "../../pages/Cafe/OperatsiyalarTarixi/OperatsiyalarTarixi";
import OrderCreate from "../../pages/Cafe/Order-Create/OrderCreate";
import Orders from "../../pages/Cafe/Orders/Orders";
import Return from "../../pages/Cafe/Return/Return";
import Taminotchilar from "../../pages/Cafe/Taminotchilar/Taminotchilar";

const cafeRoutes = [
    {
        name: "cf home",
        path: "",
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
    {
        name: "cf taminotchilar",
        path: "taminotchilar",
        element: <Taminotchilar />
    },
    {
        name:"cf kirim",
        path:"kirim",
        element:<CafeKirim/>
    }, 
    {
        name:"cf cafedagi tovarlar",
        path:"cafedagi-tovarlar",
        element:<CafedagiTovarlar/>
    },
    {
        name:"cf operatsiyalar tarixi",
        path:"operatsiyalar-tarixi",
        element:<OperatsiyalarTarixi/>
    },
    {
        name:"cf chiqim",
        path:'chiqim',
        element:<CafeChiqim/>
    }, 
    {
        name:"cafe clients",
        path:"klientlar",
        element:<CafeClients/>
    },
    {
        name:"cafe partner detrail",
        path:"taminotchilar/:partnerId",
        element:<CafePartnerDetail/>
    },
    {
        name:"cafe klient detail",
        path:"klientlar/:partnerId",
        element:<CafeClientDetail/>
    }
];
export default cafeRoutes