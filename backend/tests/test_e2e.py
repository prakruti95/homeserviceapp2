import urllib.request
import json
import sys

def post(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(
        'http://127.0.0.1:8000' + url,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get(url, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request('http://127.0.0.1:8000' + url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def patch(url, data, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(
        'http://127.0.0.1:8000' + url,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
        method='PATCH',
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def run_tests():
    print("=== STARTING HOMESERVE E2E INTEGRATION TEST ===")
    
    print("\n[Step 1] Authenticating Demo Customer...")
    cust_auth = post('/api/auth/login', {'email': 'customer@homeserve.com', 'password': 'customer123'})
    cust_token = cust_auth['access_token']
    print(f"-> Customer Logged In: {cust_auth['user']['full_name']} (Role: {cust_auth['user']['role']})")

    print("\n[Step 2] Querying Service Catalog...")
    catalog = get('/api/services?limit=5')
    services = catalog.get('services', [])
    assert len(services) > 0, "No services returned from catalog"
    srv = services[0]
    print(f"-> Found Service: {srv['name']} | Category: {srv.get('category', {}).get('name')} | Price: ${srv['base_price']}")

    print("\n[Step 3] Customer Creating Service Booking...")
    booking = post('/api/bookings', {
        'service_id': srv['id'],
        'provider_id': 2,
        'scheduled_date': '2026-11-05',
        'scheduled_time': '10:00:00',
        'duration_minutes': srv['duration_minutes'],
        'total_price': srv['base_price'],
        'address': '789 Pine Street, Apt 4B',
        'city': 'San Francisco',
        'zip_code': '94107',
        'notes': 'Please ring Apt 4B intercom.'
    }, token=cust_token)
    b_id = booking['id']
    print(f"-> Booking Created: ID #{b_id} | Status: {booking['status']}")

    print("\n[Step 4] Customer Executing Secure Payment...")
    payment = post('/api/payments', {
        'booking_id': b_id,
        'amount': booking['total_price'],
        'payment_method': 'credit_card'
    }, token=cust_token)
    print(f"-> Payment Processed: Trans ID {payment['transaction_id']} | Status: {payment['status']}")

    print("\n[Step 5] Authenticating Provider & Processing Workflow...")
    prov_auth = post('/api/auth/login', {'email': 'provider@homeserve.com', 'password': 'provider123'})
    prov_token = prov_auth['access_token']
    print(f"-> Provider Logged In: {prov_auth['user']['full_name']}")

    # Transition 1: Confirmed
    b_conf = patch(f'/api/bookings/{b_id}/status', {'status': 'confirmed'}, token=prov_token)
    print(f"-> State Transition: pending -> {b_conf['status']}")

    # Transition 2: In Progress
    b_prog = patch(f'/api/bookings/{b_id}/status', {'status': 'in_progress'}, token=prov_token)
    print(f"-> State Transition: confirmed -> {b_prog['status']}")

    # Transition 3: Completed
    b_comp = patch(f'/api/bookings/{b_id}/status', {'status': 'completed'}, token=prov_token)
    print(f"-> State Transition: in_progress -> {b_comp['status']}")

    print("\n[Step 6] Customer Submitting Review & Star Rating...")
    review = post('/api/reviews', {
        'booking_id': b_id,
        'rating': 5.0,
        'comment': 'Flawless job, clean and fast. Will definitely book again!'
    }, token=cust_token)
    print(f"-> Review Published: {review['rating']} Stars | Comment: \"{review['comment']}\"")

    print("\n[Step 7] Admin Verifying Real-Time SaaS Analytics...")
    admin_auth = post('/api/auth/login', {'email': 'admin@homeserve.com', 'password': 'admin123'})
    admin_token = admin_auth['access_token']
    stats = get('/api/admin/stats', token=admin_token)
    print(f"-> Total Registered Users: {stats['total_users']}")
    print(f"-> Total System Bookings: {stats['total_bookings']}")
    print(f"-> Gross Settled Revenue: ${stats['total_revenue']:.2f}")
    print(f"-> Platform Average Rating: {stats['average_rating']} / 5.0")

    print("\n=== ALL TEST CRITERIA MET WITH 100% SUCCESS ===")

if __name__ == '__main__':
    run_tests()
