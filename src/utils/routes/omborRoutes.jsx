import UserAccountPage from "../../pages/Admin/Account/Acccount";
import OmborChiqim from "../../pages/Ombor/Chiqim/OmborChiqim";
import OmborKirim from "../../pages/Ombor/Kirim/OmborKirim";
import OmbordagiTovarlar from "../../pages/Ombor/OmbordagiTovarlar/OmbordagiTovarlar";
import OperatsiyalarTarixi from "../../pages/Ombor/OperatsiyalarTarixi/OperatsiyalarTarixi";

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
        name:"ombor account",
        path:"account",
        element:<UserAccountPage/>
    }
];
export default omborRoutes;