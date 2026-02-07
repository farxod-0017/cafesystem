import { $api } from "../api/axios";
import { BASE_URL } from "../api/axios";
class apiStock {
    static All = async () => {
        const response = await $api.get(`${BASE_URL}/stocks`)
        return response;
    }
    static getStocksForOperationById = async (locId, search, type) => {
        const response = await $api.get(`${BASE_URL}/stocks/inv?locationId=${locId}&parentId=${locId}&type=${type}&searchText=${search}`);
        return response;
    }
}

export { apiStock };