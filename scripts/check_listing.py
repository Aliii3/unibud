"""Check store/listing.md against App Store Connect's field limits.

Usage: python3 scripts/check_listing.py

App Store Connect rejects an over-length field on submit rather than on
save, which is a slow way to find out. This parses each fenced block under
its heading and fails the build instead.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISTING = os.path.join(ROOT, 'store', 'listing.md')

# Field -> maximum characters, per App Store Connect.
LIMITS = {
    'Name': 30,
    'Subtitle': 30,
    'Keywords': 100,
    'Promotional text': 170,
    'Description': 4000,
    "What's New": 4000,
}


def blocks(text):
    """Yield (heading, fenced body) for every '## Heading' with a code block."""
    pattern = re.compile(
        r'^## (?P<head>.+?)\s*$\n(?P<between>.*?)^```\n(?P<body>.*?)^```',
        re.MULTILINE | re.DOTALL,
    )
    for m in pattern.finditer(text):
        yield m.group('head').strip(), m.group('body').rstrip('\n')


def main():
    text = open(LISTING, encoding='utf-8').read()
    found, failures = {}, []

    for head, body in blocks(text):
        for field, limit in LIMITS.items():
            if head.startswith(field):
                found[field] = body
                n = len(body)
                status = 'ok' if n <= limit else 'OVER'
                print(f'{field:20} {n:>5} / {limit:<5} {status}')
                if n > limit:
                    failures.append(f'{field} is {n - limit} characters over {limit}')

    for field in LIMITS:
        if field not in found:
            failures.append(f'{field} is missing from store/listing.md')

    # Keywords have their own rules worth enforcing.
    kw = found.get('Keywords', '')
    if kw:
        if ', ' in kw:
            failures.append('Keywords: drop the spaces after commas, each one costs a character')
        terms = [t for t in kw.split(',') if t]
        if len(terms) != len(set(terms)):
            failures.append('Keywords: duplicate term')
        indexed = f"{found.get('Name', '')} {found.get('Subtitle', '')}".lower()
        indexed_words = set(re.findall(r'[a-z]+', indexed))
        repeats = sorted(t for t in terms if t.lower() in indexed_words)
        if repeats:
            failures.append(
                'Keywords repeat a word already indexed from the name or '
                f'subtitle: {", ".join(repeats)}'
            )

    if failures:
        print('\nFAILED')
        for f in failures:
            print(f'  - {f}')
        sys.exit(1)
    print('\nlisting copy is within every limit')


if __name__ == '__main__':
    main()
