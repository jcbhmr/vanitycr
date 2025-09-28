Forwarded = ("," OWS)* fe:ForwardedElement arr:(OWS "," fe2:(OWS fe3:ForwardedElement { return fe3 })? { return fe2 })* { return [fe].concat(arr) }
ForwardedElement = fp:ForwardedPair? arr:(";" fp2:ForwardedPair { return fp2 })* { return Object.fromEntries([fp].concat(arr)) }
ForwardedPair = t:Token "=" v:Value { return [t.toLowerCase(), v] }
Value = Token / QuotedString
Token = t:Tchar+ { return t.join("") }
Tchar = [!#$%&'*+\-.^_`|~0-9a-zA-Z]
QuotedString = '"' q:(Qdtext / QuotedPair)* '"' { return q.join("") }
Qdtext = [\t \x21\x23-\x5b\x5d-\x7e\x80-\xff]
QuotedPair = "\\" v:[\t \x21-\x7e\x80-\xff] { return v }
OWS = [\t ]*
