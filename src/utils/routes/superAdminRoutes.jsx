import SPmanagers from "../../pages/SuperAdmin/Admins/Admins";
import WarehousesPage from "../../pages/SuperAdmin/Locations/Locations";

const superAdminRoutes = [
    {
        name:"sp admins",
        path:'admins',
        element:<SPmanagers/>
    },
    {
        name:"sp loacations",
        path:"locations",
        element:<WarehousesPage/>
    }
];
export default superAdminRoutes