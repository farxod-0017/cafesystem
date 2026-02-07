// layouts/OmborLayout.jsx
import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Package, PackagePlus, PackageMinus, Handshake } from "lucide-react";
import WarehouseGuard from "../auth/WarehouseGuard";

const links = [
    { label: "Ombor", to: "/ombor", icon: Package },
    { label: "Kirim", to: "/ombor/kirim", icon: PackagePlus },
    { label: "Chiqim", to: "/ombor/chiqim", icon: PackageMinus },
    { label: "Ta'minotchilar", to: "/ombor/taminotchilar", icon: Handshake },
];

export default function OmborLayout() {
    const { collapsed } = useUIStore();

    return (
        <WarehouseGuard isCafe={false}>
            <Box>
                <Sidebar
                    collapsed={collapsed}
                    links={links}
                    role={"ombor"}
                    end={true}
                />
                <Box
                    pl={collapsed ? "80px" : "250px"}
                    transition="0.25s ease"
                    minH="100vh"
                >
                    <Outlet />
                </Box>
            </Box>
        </WarehouseGuard>
    );
}