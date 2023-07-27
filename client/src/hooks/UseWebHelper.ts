export interface IWebHelperErrorResponse {
    status: number,
    response: any,
    error: any
}

export const useWebHelper = () => {
    async function GetAsync<T>(url: string, endpoint: string): Promise<T | null> {
        try {
            let data = {
                url: url,
                endpoint: endpoint,
                method: "GET",
                data: {}
            }
        
            var requestOptions = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }

            return handleResponse(requestOptions);
            
        } catch (err: any) {
            let errorResponse: IWebHelperErrorResponse = {
                status: 400,
                response: "An error occurred while sending request client side",
                error: err.message
            }

            throw errorResponse;
        }
    }

    async function PostAsync<T, U>(url: string, endpoint: string, body: U): Promise<T | null> {
        try {
            let data = {
                url: url,
                endpoint: endpoint,
                method: "POST",
                data: body
            }
        
            var requestOptions = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }

            return handleResponse(requestOptions);
            
        } catch (err: any) {
            let errorResponse: IWebHelperErrorResponse = {
                status: 400,
                response: "An error occurred while sending request client side",
                error: err.message
            }

            throw errorResponse;
        }
    }

    async function PutAsync<T, U>(url: string, endpoint: string, body: U): Promise<T | null> {
        try {
            let data = {
                url: url,
                endpoint: endpoint,
                method: "PUT",
                data: body
            }
        
            var requestOptions = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }
    
            return handleResponse(requestOptions);
            
        } catch (err: any) {
            let errorResponse: IWebHelperErrorResponse = {
                status: 400,
                response: "An error occurred while sending request client side",
                error: err.message
            }

            throw errorResponse;
        }
    }

    async function DeleteAsync<T, U>(url: string, endpoint: string, body: U): Promise<T | null> {
        try {
            let data = {
                url: url,
                endpoint: endpoint,
                method: "DELETE",
                data: body
            }
        
            var requestOptions = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }
    
            return handleResponse(requestOptions);
            
        } catch (err: any) {
            let errorResponse: IWebHelperErrorResponse = {
                status: 400,
                response: "An error occurred while sending request client side",
                error: err.message
            }

            throw errorResponse;
        }
    }

    async function handleResponse<T>(requestOptions: object): Promise<T | null> {
        let errorResponse: IWebHelperErrorResponse;

        const response: Response = await fetch("/api/proxy", requestOptions);

        if (response.ok) {
            try {
                const data: T = await response.json();
                return data; //Because this is an async function, javascript automatically resolves the promise when returned
            } catch (err: any) {
                errorResponse = {
                    status: 400,
                    response: "Api returned 200, unable to parse data into type specified during call",
                    error: err.message
                }
            }
        } else {
            let resBody: any = null;
            try {
                resBody = await response.json();
            } catch {} //Let it silently fail, no need to throw a new error

            errorResponse = {
                status: response.status,
                response: resBody,
                error: null
            }
        }

        throw errorResponse;
    }

    return { GetAsync, PostAsync, PutAsync, DeleteAsync };
}