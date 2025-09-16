> [!WARNING]
> This is super-duper bad code. It is not worth using in the modern age, and not worth fixing either. Please do not use this ever.
> 
> This does _not_ handle proxying correctly, and simply transparently inspects a socket to forward it to the correct endpoint. This has the drawback of losing lots of connection information that is otherwise passed forward in a proper HTTP proxy. This mangling and forwarding of sockets also has a habit of reducing throughput or dropping altogether sometimes. This is not a place of honor. No highly esteemed deed is commemorated here.
>
> My current project, [SpruceHTTP](https://sprucehttp.com), will support proper HTTP proxying in a future, if it doesn't already by the time you're reading this.

# JoshieProx

A simple, standalone proxy server supporting proxying HTTP(S) and WebSockets to different destinations, along with a fallback destination.
