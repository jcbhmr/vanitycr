WWWAuthenticate = ("," OWS)* c:Challenge arr:(OWS "," c2:(OWS c3:Challenge {return c3})? {return c2})* {return [c].concat(arr)}
Token = t:Tchar+ { return t.join("") }
Tchar = [!#$%&'*+\-.^_`|~0-9a-zA-Z]
QuotedString = '"' q:(Qdtext / QuotedPair)* '"' { return q.join("") }
Qdtext = [\t \x21\x23-\x5b\x5d-\x7e\x80-\xff]
QuotedPair = "\\" v:[\t \x21-\x7e\x80-\xff] { return v }
OWS = [\t ]*
Challenge = as:AuthScheme v:(" "+ v2:(apl:AuthParamList {return {params:apl}} / t:Token68 {return {token:t}}) {return v2})? {return { scheme: as.toLowerCase(), ...v }}
AuthParamList = ("," OWS)* ap:AuthParam arr:(OWS "," ap2:(OWS ap3:AuthParam {return ap3})? {return ap2})* {return Object.fromEntries([ap].concat(arr))}
AuthScheme = Token
Token68 = $([a-zA-Z0-9\-._~+/]+ "="*)
AuthParam = k:Token BWS "=" BWS v:(Token / QuotedString) {return [k.toLowerCase(), v]}
BWS = OWS
