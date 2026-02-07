import UserAccountPage from "../../pages/Admin/Account/Acccount";
import OmborChiqim from "../../pages/Ombor/Chiqim/OmborChiqim";
import OmborKirim from "../../pages/Ombor/Kirim/OmborKirim";

const omborRoutes = [
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
        name:"ombor account",
        path:"account",
        element:<UserAccountPage/>
    }
];
export default omborRoutes;