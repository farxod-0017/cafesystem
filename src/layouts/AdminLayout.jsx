import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { CreditCard, Home,  LayoutGridIcon, Menu } from "lucide-react";

const links = [
    { label: "Home", to: "/", icon: Home },
    { label: "To'lov usullari", to: "/tolov-usullari", icon: CreditCard },
    { label: "Kategoriyalar", to: "/kategoriyalar", icon: LayoutGridIcon },
    { label: "Mahsulotlar", to: "/menu-mahsulotlar", icon: Menu },
]

export default function AdminLayout() {
    const { collapsed } = useUIStore();
    return (
        <Box>
            <Sidebar collapsed={collapsed} links={links} role={"admin"} />
            <Box
                pl={collapsed ? "80px" : "250px"}
                transition="0.25s ease"
                minH="100vh"
            >
                <Outlet />
            </Box>
        </Box>
    )
}