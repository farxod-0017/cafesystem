import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { BanknoteArrowDown, BanknoteIcon, CreditCard, Home,  LayoutGridIcon, Menu, Package, Users2Icon } from "lucide-react";

const links = [
    { label: "Home", to: "/", icon: Home },
    { label: "To'lov usullari", to: "/tolov-usullari", icon: CreditCard },
    { label: "Kassalar", to: "/kassalar", icon: BanknoteIcon },
    { label: "Mahsulotlar", to: "/mahsulotlar", icon: Package },
    { label: "Kategoriyalar", to: "/kategoriyalar", icon: LayoutGridIcon },
    { label: "Menu", to: "/menu", icon: Menu },
    // { label: "Xodimlar", to: "/xodimlar", icon: Users2Icon },
]

export default function AdminLayout() {
    const { collapsed } = useUIStore();
    return (
        <Box>
            <Sidebar collapsed={collapsed} links={links} role={"admin"} end={false} />
            <Box
                pl={collapsed ? "70px" : "230px"}
                transition="0.25s ease"
                minH="100vh"
            >
                <Outlet />
            </Box>
        </Box>
    )
}