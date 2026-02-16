import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiStatistics {
    static getBalance = async (locationId, start, end) => {
        const response = await $api.get(`${BASE_URL}/statistic/balance?locationId=${locationId}&startDate=${start}&endDate=${end}`)
        return response;
    }
    static getStatistics = async (locationId) => {
        const response = await $api.get(`${BASE_URL}/statistic/statistic?locationId=${locationId}`)
        return response;
    }
}

export { apiStatistics };