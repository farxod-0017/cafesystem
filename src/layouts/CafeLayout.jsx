import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Home, BringToFront, Logs, Layers, Handshake, PackagePlus, Package, Move, PackageMinus, Users } from "lucide-react";
import WarehouseGuard from "../auth/WarehouseGuard";
import Header from "../components/common/Header";

const links = [
    { label: "Home", to: "/cafe", icon: Home, end: true },
    { label: "Zakaz yaratish", to: "/cafe/order-create", icon: BringToFront },
    { label: "Zakazlar", to: "/cafe/orders", icon: Logs },
    { label: "Cafedagi tovarlar", to: "/cafe/cafedagi-tovarlar", icon: Package },
    { label: "Kirim", to: "/cafe/kirim", icon: PackagePlus },
    { label: "Chiqim", to: "/cafe/chiqim", icon: PackageMinus },
    { label: "Operatsiyalar tarixi", to: "/cafe/operatsiyalar-tarixi", icon: Move },
    { label: "Taminotchilar", to: "/cafe/taminotchilar", icon: Handshake },
    { label: "Klientlar", to: "/cafe/klientlar", icon: Users },
]

export default function CafeLayout() {
    const { collapsed } = useUIStore();
    return (
        <WarehouseGuard isCafe={true}>
            <Box>
                <Header links={links} />
                <Sidebar collapsed={collapsed} links={links} role={"seller"} end={true} />
                <Box
                    pl={{ base: 0, md: collapsed ? "70px" : "230px" }}
                    pt={{ base: '42px', md: '0' }}
                    transition="0.25s ease"
                    minH="100vh"
                >
                    <Outlet />
                </Box>
            </Box>
        </WarehouseGuard>

    )
}