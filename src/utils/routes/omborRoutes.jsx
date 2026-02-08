import UserAccountPage from "../../pages/Admin/Account/Acccount";
import OmborChiqim from "../../pages/Ombor/Chiqim/OmborChiqim";
import ClientsPage from "../../pages/Ombor/Clients/Clinets";
import OmborKirim from "../../pages/Ombor/Kirim/OmborKirim";
import OmbordagiTovarlar from "../../pages/Ombor/OmbordagiTovarlar/OmbordagiTovarlar";
import OperatsiyalarTarixi from "../../pages/Ombor/OperatsiyalarTarixi/OperatsiyalarTarixi";
import TaminotchilarPage from "../../pages/Ombor/TaminotchilarPage/TaminotchilarPage";

const omborRoutes = [
    {
        name:"ombordagi tovarlar",
        path:"",
        element:<OmbordagiTovarlar/>
    },
    {
        name:"ombor kirim",
        path:"kirim",
        element:<OmborKirim/>
    },
    {
        name:"ombor chiqim",
        path:"chiqim",
        element:<OmborChiqim/>
    },
    {
        name:"operatsiyalar tarixi",
        path:"operatsiyalar-tarixi",
        element: <OperatsiyalarTarixi/>
    },
    {
        name:"taminotchilar table",
        path:"taminotchilar",
        element:<TaminotchilarPage/>
    },
    {
        name:"klientlar table",
        path:"klientlar",
        element:<ClientsPage/>
    },
    {
        name:"ombor account",
        path:"account",
        element:<UserAccountPage/>
    }
];
export default omborRoutes;