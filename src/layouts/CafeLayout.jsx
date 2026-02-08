import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Home, BringToFront, Logs, Layers, Handshake, PackagePlus } from "lucide-react";
import WarehouseGuard from "../auth/WarehouseGuard";

const links = [
    { label: "Home", to: "/cafe/dashboard", icon: Home },
    { label: "Zakaz yaratish", to: "/cafe/order-create", icon: BringToFront },
    { label: "Zakazlar", to: "/cafe/orders", icon: Logs },
    { label: "Taminotchilar", to: "/cafe/taminotchilar", icon: Handshake },
    { label: "Kirim", to: "/cafe/kirim", icon: PackagePlus },

]

export default function CafeLayout() {


    const { collapsed } = useUIStore();
    return (
        <WarehouseGuard isCafe={true}>
            <Box>
                <Sidebar collapsed={collapsed} links={links} role={"seller"} />
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