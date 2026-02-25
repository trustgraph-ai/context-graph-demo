
tg-start-flow -n everything -i retail -d 'Retail processing'

tg-set-collection -n retail -d 'Retail intelligence'

# Load test data files

tg-add-library-document -U trustgraph --name "Consumer Segments" \
    --description "Analysis of consumer segments including demographics, spending patterns, and journey stages" \
    --keyword consumer segments demographics retail \
    --identifier "https://trustgraph.ai/retail/consumer-segments" -k text/markdown \
    --tags "consumer,segments,demographics,retail" \
    test-data/consumer-segments.md

tg-add-library-document -U trustgraph --name "Brand Profiles" \
    --description "Brand portfolio overview including positioning, campaigns, and sentiment scores" \
    --keyword brand portfolio marketing positioning \
    --identifier "https://trustgraph.ai/retail/brand-profiles" -k text/markdown \
    --tags "brand,portfolio,marketing,positioning" \
    test-data/brand-profiles.md

tg-add-library-document -U trustgraph --name "Retail Channels" \
    --description "Retail channel performance including traffic, conversion rates, and experience scores" \
    --keyword retail channels performance conversion \
    --identifier "https://trustgraph.ai/retail/retail-channels" -k text/markdown \
    --tags "retail,channels,performance,conversion" \
    test-data/retail-channels.md

tg-add-library-document -U trustgraph --name "AI Agents" \
    --description "AI agent deployment specifications including capabilities, accuracy, and decision volumes" \
    --keyword agent AI automation orchestration \
    --identifier "https://trustgraph.ai/retail/ai-agents" -k text/markdown \
    --tags "agent,AI,automation,orchestration" \
    test-data/ai-agents.md

tg-add-library-document -U trustgraph --name "Ecosystem Connections" \
    --description "Relationship analysis between consumers, brands, retail channels, and agents" \
    --keyword relationships ecosystem connections affinity \
    --identifier "https://trustgraph.ai/retail/ecosystem-connections" -k text/markdown \
    --tags "relationships,ecosystem,connections,affinity" \
    test-data/ecosystem-connections.md
