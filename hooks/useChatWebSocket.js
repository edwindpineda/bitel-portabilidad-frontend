import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useState, useCallback, useEffect, useRef } from 'react'

const useChatWebSocket = (contactoId, onNuevoMensaje, onMensajeEnviado) => {
    const [enviando, setEnviando] = useState(false)
    const [wsError, setWsError] = useState(null)
    const [reconnectCount, setReconnectCount] = useState(0)

    // Refs para mantener siempre las versiones más recientes de los callbacks
    const onNuevoMensajeRef = useRef(onNuevoMensaje)
    const onMensajeEnviadoRef = useRef(onMensajeEnviado)
    const contactoIdRef = useRef(contactoId)

    useEffect(() => {
        onNuevoMensajeRef.current = onNuevoMensaje
    }, [onNuevoMensaje])

    useEffect(() => {
        onMensajeEnviadoRef.current = onMensajeEnviado
    }, [onMensajeEnviado])

    useEffect(() => {
        contactoIdRef.current = contactoId
    }, [contactoId])

    // Usar variable de entorno o localhost en desarrollo
    // LOCAL: 'ws://localhost:8080'
    // PRODUCCION: 'wss://bitel-websocket.xylure.easypanel.host/'
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://bitel-websocket.xylure.easypanel.host/'

    const { sendMessage, lastMessage, readyState } = useWebSocket(wsUrl, {
        shouldReconnect: (closeEvent) => {
            // Registrar el intento de reconexión
            console.warn('WebSocket cerrado, intentando reconectar...', closeEvent)
            setReconnectCount(prev => prev + 1)
            return reconnectCount < 10 // Máximo 10 intentos
        },
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onOpen: (event) => {
            console.log('WebSocket conectado exitosamente')
            setWsError(null)
            setReconnectCount(0)

            // Enviar verificar_conexion para mantener la conexion activa
            event.target.send(JSON.stringify({ action: 'verificar_conexion' }))
            console.log('WebSocket: verificar_conexion enviado')

            // Si hay contacto, suscribirse (usar ref para valor actualizado)
            const currentContactoId = contactoIdRef.current
            if (currentContactoId) {
                event.target.send(JSON.stringify({ action: 'subscribe', id_contacto: currentContactoId }))
                console.log('WebSocket: subscribe enviado para contacto', currentContactoId)
            }
        },
        onClose: (event) => {
            console.warn('WebSocket desconectado:', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            })
        },
        onError: (event) => {
            console.error('Error en WebSocket:', event)
            setWsError({
                message: 'Error de conexión WebSocket',
                timestamp: new Date().toISOString(),
                url: wsUrl
            })
        },
        onReconnectStop: (numAttempts) => {
            console.error(`WebSocket: Se agotaron los ${numAttempts} intentos de reconexión`)
            setWsError({
                message: `Conexión fallida después de ${numAttempts} intentos`,
                timestamp: new Date().toISOString(),
                url: wsUrl
            })
        }
    })

    // Log cuando cambia el estado de conexión
    useEffect(() => {
        const estados = {
            [ReadyState.CONNECTING]: 'Conectando...',
            [ReadyState.OPEN]: 'Conectado',
            [ReadyState.CLOSING]: 'Cerrando...',
            [ReadyState.CLOSED]: 'Desconectado',
            [ReadyState.UNINSTANTIATED]: 'No inicializado'
        }
        console.log(`WebSocket estado: ${estados[readyState]}`)
    }, [readyState])

    // Suscribirse al contacto cuando cambia (y la conexión está abierta)
    useEffect(() => {
        if (readyState === ReadyState.OPEN && contactoId) {
            sendMessage(JSON.stringify({ action: 'subscribe', id_contacto: contactoId }))
            console.log('WebSocket: subscribe enviado para contacto', contactoId)
        }
    }, [contactoId, readyState, sendMessage])

    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data)
                console.log('WebSocket mensaje recibido:', data)
                console.log('WebSocket mensaje type:', data.type, '| keys:', Object.keys(data))

                // Mensaje entrante de otro usuario
                if (data.type === 'nuevo_mensaje' && data.data) {
                    console.log('WebSocket: nuevo_mensaje detectado, llamando callback')
                    onNuevoMensajeRef.current?.(data.data)
                }

                // Confirmación de mensaje enviado exitosamente
                if (data.type === 'mensaje_enviado' && data.success) {
                    onMensajeEnviadoRef.current?.(data)
                }
            } catch (error) {
                console.error('Error al parsear mensaje WebSocket:', error)
            }
        }
    }, [lastMessage])

    const enviarMensaje = useCallback(async (contenido, telefono) => {
        if (!contenido.trim()) return false

        // Verificar si está conectado antes de intentar enviar
        if (readyState !== ReadyState.OPEN) {
            console.warn('WebSocket no está conectado, no se puede enviar mensaje')
            return false
        }

        setEnviando(true)
        try {
            // Formato que espera el servidor: { action, telefono, contenido, id_contacto }
            sendMessage(JSON.stringify({
                action: 'enviar_mensaje',
                telefono: telefono,
                contenido: contenido,
                id_contacto: contactoId
            }))
            console.log('WebSocket: enviar_mensaje enviado', { telefono, contenido, id_contacto: contactoId })
            return true
        } catch (error) {
            console.error('Error al enviar mensaje por WebSocket:', error)
            return false
        } finally {
            setEnviando(false)
        }
    }, [contactoId, sendMessage, readyState])

    return {
        isConnected: readyState === ReadyState.OPEN,
        enviando,
        enviarMensaje,
        error: wsError,
        reconnectCount,
        connectionStatus: {
            [ReadyState.CONNECTING]: 'Conectando',
            [ReadyState.OPEN]: 'Conectado',
            [ReadyState.CLOSING]: 'Cerrando',
            [ReadyState.CLOSED]: 'Desconectado',
            [ReadyState.UNINSTANTIATED]: 'No inicializado'
        }[readyState]
    }
}

export default useChatWebSocket