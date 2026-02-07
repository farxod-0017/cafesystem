// components/common/TopLoadingLine.jsx
import { Box, useColorModeValue } from "@chakra-ui/react";

export default function TopLoadingLine() {
    const gradientLight = "linear(to-r, brand.400, brand.600, brand.400)";
    const gradientDark = "linear(to-r, brand.300, brand.500, brand.300)";
    
    const gradient = useColorModeValue(gradientLight, gradientDark);
    const bgColor = useColorModeValue("neutral.200", "neutral.700");

    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            h="4px"
            bg={bgColor}
            zIndex="10000"
            overflow="hidden"
        >
            <Box
                h="100%"
                bgGradient={gradient}
                animation="shimmer 1.5s infinite"
                sx={{
                    "@keyframes shimmer": {
                        "0%": {
                            transform: "translateX(-100%)",
                        },
                        "100%": {
                            transform: "translateX(100%)",
                        },
                    },
                }}
            />
        </Box>
    );
}