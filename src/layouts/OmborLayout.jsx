// layouts/OmborLayout.jsx
import { Outlet } from "react-router";
import Sidebar from "../components/common/Sidebar";
import { Box } from "@chakra-ui/react";
import { useUIStore } from "../store/useUIStore";
import { Package, PackagePlus, PackageMinus, Handshake, Move, Users, LineChart } from "lucide-react";
import WarehouseGuard from "../auth/WarehouseGuard";
import Header from "../components/common/Header";

const links = [
    { label: "Ombor", to: "/ombor", icon: Package, end: true },
    { label: "Kirim", to: "/ombor/kirim", icon: PackagePlus },
    { label: "Chiqim", to: "/ombor/chiqim", icon: PackageMinus },
    { label: "Operatsiyalar", to: "/ombor/operatsiyalar-tarixi", icon: Move },
    { label: "Ta'minotchilar", to: "/ombor/taminotchilar", icon: Handshake },
    { label: "Klientlar", to: "/ombor/klientlar", icon: Users },
    { label: "Hisobotlar", to: "/ombor/statistics", icon: LineChart },
];

export default function OmborLayout() {
    const { collapsed } = useUIStore();

    return (
        <WarehouseGuard isCafe={false}>
            <Box>
                <Header links={links}/>
                <Sidebar
                    collapsed={collapsed}
                    links={links}
                    role={"ombor"}
                    end={true}
                />
                <Box
                    pl={{base: 0, md:collapsed ? "70px" : "230px"}}
                    pt={{base:'42px', md:'0'}}
                    transition="0.25s ease"
                    minH="100vh"
                >
                    <Outlet />
                </Box>
            </Box>
        </WarehouseGuard>
    );
}