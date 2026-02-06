import {
    Box,
    Flex,
    Avatar,
    Text,
    Badge,
    Card,
    CardBody,
    Divider,
    VStack,
    HStack,
    useColorModeValue,
} from "@chakra-ui/react";
import { formatDateTime } from "../../../utils/tools/formatDateTime";
import { apiUsers } from "../../../utils/Controllers/Users";
import { useAuth } from "../../../hooks/useAuth";
import { useAuthStore } from "../../../store/authStore";
import { useEffect, useState } from "react";
import Cookies from "js-cookie"
// import axios from "axios";

export default function UserAccountPage() {
    // === MOCK DATA (API o‘rniga) ===
    const [user, setUser] = useState({})


    const fetchUser = async () => {
        const userId = Cookies.get("user_id")
        try {
            const res = await apiUsers.getUser(userId);
            setUser(res.data)
        } finally {

        }
    };
    useEffect(()=> {
        fetchUser()
    },[])

    const initials = user.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    const cardBg = useColorModeValue("surface", "surface");
    const pageBg = useColorModeValue("bg", "bg");

    return (
        <Box bg={pageBg} minH="100vh" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
            <Box maxW="960px" mx="auto">
                <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="600" mb={6}>
                    Account maʼlumotlari
                </Text>

                <Card
                    bg={cardBg}
                    rounded="2xl"
                    border="1px solid"
                    borderColor="border"
                >
                    <CardBody>
                        <Flex
                            direction={{ base: "column", md: "row" }}
                            gap={{ base: 6, md: 8 }}
                            align={{ base: "center", md: "flex-start" }}
                        >
                            {/* AVATAR */}
                            <Avatar
                                size={{ base: "xl", md: "2xl" }}
                                name={user.full_name}
                                bg="primary"
                                color="white"
                            >
                                {initials}
                            </Avatar>

                            {/* INFO */}
                            <VStack align="start" spacing={4} flex={1} w="100%">
                                <Box w="100%">
                                    <Text fontSize="sm" color="neutral.500">
                                        To‘liq ism
                                    </Text>
                                    <Text fontSize="lg" fontWeight="600">
                                        {user.full_name}
                                    </Text>
                                </Box>

                                <Box w="100%">
                                    <Text fontSize="sm" color="neutral.500">
                                        Username
                                    </Text>
                                    <Text>{user.username}</Text>
                                </Box>

                                <Box w="100%">
                                    <Text fontSize="sm" color="neutral.500" mb={1}>
                                        Role
                                    </Text>
                                    <Badge
                                        colorScheme={user.role === "ADMIN" ? "purple" : "gray"}
                                        px={3}
                                        py={1}
                                        rounded="full"
                                    >
                                        {user.role}
                                    </Badge>
                                </Box>

                                <Divider borderColor="border" />

                                <Flex
                                    w="100%"
                                    direction={{ base: "column", sm: "row" }}
                                    gap={4}
                                >
                                    <Box flex={1}>
                                        <Text fontSize="sm" color="neutral.500">
                                            Account yaratilgan
                                        </Text>
                                        <Text fontSize="sm">
                                            {formatDateTime(user.createdAt)}
                                        </Text>
                                    </Box>

                                    <Box flex={1}>
                                        <Text fontSize="sm" color="neutral.500">
                                            Oxirgi yangilanish
                                        </Text>
                                        <Text fontSize="sm">
                                            {formatDateTime(user.updatedAt)}
                                        </Text>
                                    </Box>
                                </Flex>

                                <Badge
                                    colorScheme="green"
                                    variant="subtle"
                                    alignSelf="flex-start"
                                >
                                    Active
                                </Badge>
                            </VStack>
                        </Flex>
                    </CardBody>
                </Card>
            </Box>
        </Box>
    );
}
