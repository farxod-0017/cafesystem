import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Home, BringToFront, Logs, Layers, Handshake, PackagePlus, Package, Move } from "lucide-react";
import WarehouseGuard from "../auth/WarehouseGuard";

const links = [
    { label: "Home", to: "/cafe", icon: Home },
    { label: "Zakaz yaratish", to: "/cafe/order-create", icon: BringToFront },
    { label: "Zakazlar", to: "/cafe/orders", icon: Logs },
    { label: "Cafedagi tovarlar", to: "/cafe/cafedagi-tovarlar", icon: Package },
    { label: "Kirim", to: "/cafe/kirim", icon: PackagePlus },
    { label: "Operatsiyalar tarixi", to: "/cafe/operatsiyalar-tarixi", icon: Move },
    { label: "Taminotchilar", to: "/cafe/taminotchilar", icon: Handshake },

]

export default function CafeLayout() {


    const { collapsed } = useUIStore();
    return (
        <WarehouseGuard isCafe={true}>
            <Box>
                <Sidebar collapsed={collapsed} links={links} role={"seller"} end={true} />
                <Box
                    pl={collapsed ? "80px" : "250px"}
                    transition="0.25s ease"
                    minH="100vh"
                >
                    <Outlet />
                </Box>
            </Box>
        </WarehouseGuard>

    )
}