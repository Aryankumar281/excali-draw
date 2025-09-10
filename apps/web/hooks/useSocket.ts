import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket(){
    const [loading, setLoading] = useState(true);
    const [ socket,setSocket] = useState<WebSocket>();

    useEffect(()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYzk4MmJlNC0zZjA2LTRmN2MtYjUwNS0xMDUyOTMxNzI5ZGEiLCJpYXQiOjE3NTcxNDkxMjAsImV4cCI6MTc1NzE1MjcyMH0.f-OZPTx5-L49JgeRrd3p40Wqj4qpZUQ_V-B0-GB3DlI`);
        ws.onopen= ()=>{
            setLoading(false);
            setSocket(ws);
        }
    },[])


    return {
        socket,
        loading
    }
}