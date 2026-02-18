import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiPaymentItems {
    static Create = async (data) => {
        const response = await $api.post(`${BASE_URL}/payment-items`, data,)
        return response;
    }
}

export { apiPaymentItems };