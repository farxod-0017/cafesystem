import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiPrinter {
    static printPayment = async (id) => {
        const response = await $api.get(`${BASE_URL}/printer/${id}`)
        return response;
    }
}

export { apiPrinter };