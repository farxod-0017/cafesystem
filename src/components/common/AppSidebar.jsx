import { Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerOverlay, Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Text, VStack } from "@chakra-ui/react";
import { UserCog2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

export default function AppSidebar({ isOpen, onClose, links, role }) {
    const navigate = useNavigate()
    return (
        <Drawer
            isOpen={isOpen}
            placement="left"
            onClose={onClose}
        >
            <DrawerOverlay />
            <DrawerContent maxW={'70vw'} p={1}>
                <DrawerCloseButton size={'sm'} />
                <DrawerBody p={1}>
                    <Flex direction={'column'} justify={'space-between'} align={'start'} minH={'calc(100vh - 20px)'}>
                        {/* TOP LINKS */}
                        <VStack align="stretch" spacing={1} mt={6}>
                            {links.map((item) => (
                                <NavLink key={item.to} to={item.to} style={{ textDecoration: "none" }} end={item.end}>
                                    {({ isActive }) => (
                                        <Flex
                                            onClick={onClose}
                                            align="center"
                                            gap={2}
                                            px={2}
                                            py={'6px'}
                                            borderRadius="lg"
                                            bg={isActive ? "secondary" : "transparent"}
                                            _hover={{ bg: "secondary", color: "white" }}
                                            cursor="pointer"
                                            transition="0.2s"
                                            color={isActive ? "white" : "text"}
                                        >
                                            <Icon as={item.icon} w={5} h={5} />
                                            <Text fontWeight="sm">{item.label}</Text>
                                        </Flex>
                                    )}
                                </NavLink>
                            ))}
                        </VStack>
                        <VStack>
                            {(role !== "SUPER_ADMIN") &&
                                <Menu>
                                    <MenuButton
                                        color={"text"}
                                        borderRadius={"md"}
                                        _hover={{ bg: "secondary", color: "white" }}
                                    >
                                        <Flex
                                            align="center"
                                            gap={2}
                                            p={2}
                                            borderRadius="md"
                                        >
                                            <UserCog2 size={20} />
                                            <Text>Role</Text>
                                        </Flex>
                                    </MenuButton>
                                    <MenuList bg="surface" borderColor="gray.700" w={'50vw'} maxW={'50vw'} minW={'50vw'} p={1}>
                                        <MenuItem p={1} color={role === "ombor" ? "green" : "text"} onClick={() => {
                                            navigate('/ombor')
                                        }}>Ombor</MenuItem>
                                        <MenuItem p={1} color={role === "seller" ? "green" : "text"} onClick={() => {
                                            navigate('/cafe')
                                        }}>Cafe</MenuItem>
                                        <MenuItem p={1} color={role === "admin" ? "green" : "text"} onClick={() => {
                                            navigate('/')
                                        }}>Admin</MenuItem>
                                    </MenuList>
                                </Menu>}
                        </VStack>
                    </Flex>
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    )
}