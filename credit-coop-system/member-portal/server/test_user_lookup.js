const pool = require('./db_members');

async function testUserLookup() {
    try {
        console.log('Testing user lookup functionality...');
        
        // Get a sample member email from the database
        const sampleMember = await pool.query(`
            SELECT user_id, user_email, member_number 
            FROM member_users 
            WHERE is_active = true 
            LIMIT 1
        `);
        
        if (sampleMember.rows.length === 0) {
            console.log('❌ No active members found in database');
            return;
        }
        
        const member = sampleMember.rows[0];
        console.log('✅ Found sample member:');
        console.log(`   Email: ${member.user_email}`);
        console.log(`   Member Number: ${member.member_number}`);
        console.log(`   User ID (integer): ${member.user_id}`);
        
        // Test the lookup logic that will be used in the loan application
        const testEmail = member.user_email;
        const memberQuery = `
            SELECT user_id, member_number 
            FROM member_users 
            WHERE user_email = $1
        `;
        const memberResult = await pool.query(memberQuery, [testEmail]);
        
        if (memberResult.rows.length > 0) {
            const actualUserId = memberResult.rows[0].user_id;
            const memberNumber = memberResult.rows[0].member_number;
            
            console.log('✅ User lookup successful:');
            console.log(`   Found User ID: ${actualUserId} (type: ${typeof actualUserId})`);
            console.log(`   Found Member Number: ${memberNumber}`);
            
            if (typeof actualUserId === 'number') {
                console.log('✅ User ID is a number - compatible with database!');
            } else {
                console.log('❌ User ID is not a number - may cause issues');
            }
        } else {
            console.log('❌ Member lookup failed');
        }
        
        console.log('\n🎯 The loan application should now work with member email lookup!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await pool.end();
    }
}

testUserLookup();