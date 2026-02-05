import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Home, } from "lucide-react";

const links = [
    { label: "Home", to: "/cafe", icon: Home },
]

export default function CafeLayout() {
    const { collapsed } = useUIStore();
    return (
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
    )
}