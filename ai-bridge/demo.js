const axios = require('axios');

async function demonstrateAIBridge() {
  console.log('🤖 Exiled Exchange 2 - AI Bridge Demo\n');
  
  // Test health endpoint
  console.log('1. Testing bridge health...');
  try {
    const health = await axios.get('http://localhost:3001/health');
    console.log('✅ Bridge is healthy:', health.data.status);
  } catch (error) {
    console.log('❌ Bridge health check failed');
    return;
  }

  // Test price checking with AI enhancement
  console.log('\n2. Testing AI-enhanced price checking...');
  
  const testItem = {
    itemText: `Rarity: Rare
Bone Sword
---
One Handed Sword
Physical Damage: 15-30
Critical Strike Chance: 5%
Attack Speed: 1.3 attacks per second
---
Requirements:
Level: 12
Str: 25
Dex: 25
---
Sockets: R-R 
---
Item Level: 15
---
+40% increased Physical Damage
10% increased Attack Speed
Adds 5-10 Physical Damage
+15 to maximum Life`,
    league: 'Hardcore'
  };

  try {
    const priceCheck = await axios.post('http://localhost:3001/api/price-check', testItem, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Price check completed:');
    console.log('📋 Item parsed:', priceCheck.data.item.name, '-', priceCheck.data.item.type);
    console.log('📊 Mods found:', priceCheck.data.item.mods.length);
    console.log('💰 Pricing:', priceCheck.data.pricing.error || 'API data available');
    console.log('🧠 AI Insights:', priceCheck.data.aiInsights.source);
    
  } catch (error) {
    console.log('❌ Price check failed:', error.message);
  }

  // Test market analysis
  console.log('\n3. Testing market analysis...');
  
  try {
    const market = await axios.get('http://localhost:3001/api/market/Hardcore?currency=divine');
    console.log('✅ Market analysis completed:');
    console.log('🏛️ League:', market.data.league);
    console.log('💎 Currency:', market.data.market.currency);
    console.log('🔮 AI Analysis:', market.data.analysis.source || 'Available');
    
  } catch (error) {
    console.log('❌ Market analysis failed:', error.message);
  }

  console.log('\n🎯 AI Bridge Integration Points:');
  console.log('   → http://localhost:3001/health - Service status');
  console.log('   → http://localhost:3001/api/price-check - AI price analysis');
  console.log('   → http://localhost:3001/api/market/{league} - Market intelligence');
  console.log('   → http://localhost:3001/api/chat - Direct AI conversations');
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Configure LibreChat authentication for full AI features');
  console.log('   2. Integrate these endpoints into your Exiled Exchange 2 main app');
  console.log('   3. Add more data sources (poe2scout, craftofexile, etc.)');
  console.log('   4. Extend with crafting advice and build optimization');
  
  console.log('\n✨ AI Bridge Demo Complete!\n');
}

// Run the demo
demonstrateAIBridge().catch(console.error);