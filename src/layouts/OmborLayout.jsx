import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Home, Package, PackageMinus, PackagePlus, PackageX } from "lucide-react";

const links = [
    { label: "Ombor", to: "/ombor", icon: Package },
    { label: "Kirim", to: "/ombor/kirim", icon: PackagePlus },
    { label: "Chiqim", to: "/ombor/chiqim", icon: PackageMinus },
    { label: "Utilizatsiya", to: "/ombor/utilizatsiya", icon:PackageX },
]

export default function OmborLayout() {
    const { collapsed } = useUIStore();
    return (
        <Box>
            <Sidebar collapsed={collapsed} links={links} role={"ombor"} />
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